import CoreImage
import CoreImage.CIFilterBuiltins

/// Renders `ColorGradeSettings` and `VideoEffectType` as real Core Image filter
/// chains, applied per-frame by `EditorVideoCompositor`. Uses the typed
/// `CIFilterBuiltins` API (rather than string-keyed `CIFilter(name:)` + KVC)
/// so a mistyped parameter is a compile error, not a runtime crash.
///
/// `.cameraShake` is intentionally not handled here: it's realized as transform
/// jitter on the layer itself (see `EditorVideoCompositor`), not a pixel filter.
enum VideoEffectRenderer {
    static func applyColorGrade(_ settings: ColorGradeSettings, to image: CIImage) -> CIImage {
        guard !settings.isNeutral else { return image }

        let colorControls = CIFilter.colorControls()
        colorControls.inputImage = image
        colorControls.brightness = Float(settings.brightness)
        colorControls.contrast = Float(settings.contrast)
        colorControls.saturation = Float(settings.saturation)

        guard let colorAdjusted = colorControls.outputImage else { return image }

        guard settings.temperature != 6500 || settings.tint != 0 else { return colorAdjusted }

        let temperatureAndTint = CIFilter.temperatureAndTint()
        temperatureAndTint.inputImage = colorAdjusted
        temperatureAndTint.neutral = CIVector(x: 6500, y: 0)
        temperatureAndTint.targetNeutral = CIVector(x: CGFloat(settings.temperature), y: CGFloat(settings.tint))

        return temperatureAndTint.outputImage ?? colorAdjusted
    }

    static func applyEffect(_ effect: VideoEffectType?, to image: CIImage, extent: CGRect) -> CIImage {
        guard let effect else { return image }

        switch effect {
        case .vignette:
            let filter = CIFilter.vignette()
            filter.inputImage = image
            filter.intensity = 1.0
            filter.radius = 1.6
            return filter.outputImage?.cropped(to: extent) ?? image

        case .glow:
            let filter = CIFilter.bloom()
            filter.inputImage = image
            filter.intensity = 0.6
            filter.radius = 8
            return filter.outputImage?.cropped(to: extent) ?? image

        case .bloom:
            let filter = CIFilter.bloom()
            filter.inputImage = image
            filter.intensity = 1.0
            filter.radius = 20
            return filter.outputImage?.cropped(to: extent) ?? image

        case .motionBlur:
            let filter = CIFilter.motionBlur()
            filter.inputImage = image
            filter.radius = 14
            filter.angle = 0
            return filter.outputImage?.cropped(to: extent) ?? image

        case .filmGrain:
            return applyFilmGrain(to: image, extent: extent)

        case .lensFlare:
            return applyLensFlare(to: image, extent: extent)

        case .depthOfField:
            return applyDepthOfField(to: image, extent: extent)

        case .cameraShake:
            return image
        }
    }

    private static func applyFilmGrain(to image: CIImage, extent: CGRect) -> CIImage {
        let noise = CIFilter.randomGenerator().outputImage?.cropped(to: extent)
        guard let noise else { return image }

        // Attenuate the noise's alpha so it reads as subtle grain rather than solid static.
        let attenuate = CIFilter.colorMatrix()
        attenuate.inputImage = noise
        attenuate.aVector = CIVector(x: 0, y: 0, z: 0, w: 0.06)

        guard let attenuatedNoise = attenuate.outputImage else { return image }

        let blend = CIFilter.softLightBlendMode()
        blend.inputImage = attenuatedNoise
        blend.backgroundImage = image
        return blend.outputImage?.cropped(to: extent) ?? image
    }

    private static func applyLensFlare(to image: CIImage, extent: CGRect) -> CIImage {
        let center = CGPoint(x: extent.midX + extent.width * 0.22, y: extent.midY + extent.height * 0.22)

        let hotspot = CIFilter.radialGradient()
        hotspot.center = center
        hotspot.radius0 = 0
        hotspot.radius1 = Float(min(extent.width, extent.height) * 0.22)
        hotspot.color0 = CIColor(red: 1, green: 0.97, blue: 0.85, alpha: 0.9)
        hotspot.color1 = CIColor(red: 1, green: 1, blue: 1, alpha: 0)

        guard let flareImage = hotspot.outputImage?.cropped(to: extent) else { return image }

        let blend = CIFilter.screenBlendMode()
        blend.inputImage = flareImage
        blend.backgroundImage = image
        return blend.outputImage?.cropped(to: extent) ?? image
    }

    private static func applyDepthOfField(to image: CIImage, extent: CGRect) -> CIImage {
        let blurFilter = CIFilter.gaussianBlur()
        blurFilter.inputImage = image
        blurFilter.radius = 12

        guard let blurred = blurFilter.outputImage?.cropped(to: extent) else { return image }

        // Radial gradient mask: sharp in a band through the center, blurred toward the edges.
        let maskFilter = CIFilter.radialGradient()
        maskFilter.center = CGPoint(x: extent.midX, y: extent.midY)
        maskFilter.radius0 = Float(min(extent.width, extent.height) * 0.28)
        maskFilter.radius1 = Float(min(extent.width, extent.height) * 0.55)
        maskFilter.color0 = CIColor(red: 1, green: 1, blue: 1, alpha: 1)
        maskFilter.color1 = CIColor(red: 0, green: 0, blue: 0, alpha: 1)

        guard let mask = maskFilter.outputImage?.cropped(to: extent) else { return image }

        let blend = CIFilter.blendWithMask()
        blend.inputImage = image
        blend.backgroundImage = blurred
        blend.maskImage = mask
        return blend.outputImage?.cropped(to: extent) ?? image
    }
}
