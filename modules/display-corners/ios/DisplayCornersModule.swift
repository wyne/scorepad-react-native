import ExpoModulesCore
import UIKit

/// Reads the corner radius of the display the app's window is on, so tiles in
/// a screen corner can be drawn concentric with it.
public class DisplayCornersModule: Module {
  public func definition() -> ModuleDefinition {
    Name("DisplayCorners")

    // The radius in points, or 0 when the OS can't report it.
    AsyncFunction("getDisplayCornerRadiusAsync") { () -> Double in
      return Double(Self.displayCornerRadius())
    }.runOnQueue(.main)
  }

  private static func keyWindow() -> UIWindow? {
    let windows = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
    return windows.first { $0.isKeyWindow } ?? windows.first
  }

  private static func displayCornerRadius() -> CGFloat {
    guard #available(iOS 26.0, *), let window = keyWindow() else { return 0 }
    // Resolving the window's own corners first lets the probe resolve
    // against them; without this the first probe can read 0.
    _ = window.effectiveRadius(corner: .topLeft)
    return probeRadius(in: window)
  }

  @available(iOS 26.0, *)
  private static func probeRadius(in container: UIView) -> CGFloat {
    // A view filling the container with container-concentric corners resolves
    // to the container's own corners.
    let probe = UIView(frame: container.bounds)
    probe.isUserInteractionEnabled = false
    probe.alpha = 0
    probe.cornerConfiguration = .corners(radius: .containerConcentric())
    container.addSubview(probe)
    defer { probe.removeFromSuperview() }
    container.layoutIfNeeded()
    return probe.effectiveRadius(corner: .topLeft)
  }
}
