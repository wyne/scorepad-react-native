package expo.modules.foldfeatures

import android.app.Activity
import androidx.window.layout.FoldingFeature
import androidx.window.layout.WindowInfoTracker
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import java.lang.ref.WeakReference

private const val FOLD_CHANGE_EVENT = "foldChange"

/**
 * Reports the fold that crosses the app's window, from Jetpack WindowManager: which way it runs
 * and where it is. expo-hinge reports whether the device is half open, but not this, and the
 * fold's direction can't be inferred from the window's shape on Android foldables.
 */
class FoldFeaturesModule : Module() {
  @Volatile
  private var currentFold: Map<String, Any>? = null
  private var hasListeners = false
  private var activity: WeakReference<Activity>? = null
  private var layoutJob: Job? = null

  override fun definition() = ModuleDefinition {
    Name("FoldFeatures")

    Events(FOLD_CHANGE_EVENT)

    // The fold crossing the window, or null when there is none (no fold, or the window is on
    // one side of it).
    Function("getFold") {
      currentFold
    }

    OnCreate {
      attach()
    }

    // The activity may not exist yet when the module is created.
    OnActivityEntersForeground {
      attach()
    }

    OnActivityEntersBackground {
      appContext.mainQueue.launch { pause() }
    }

    OnDestroy {
      pause()
    }

    OnStartObserving(FOLD_CHANGE_EVENT) {
      hasListeners = true
    }

    OnStopObserving(FOLD_CHANGE_EVENT) {
      hasListeners = false
    }
  }

  private fun attach() {
    val activity = appContext.currentActivity ?: return
    appContext.mainQueue.launch {
      if (layoutJob?.isActive == true && this@FoldFeaturesModule.activity?.get() === activity) {
        return@launch
      }
      pause()
      this@FoldFeaturesModule.activity = WeakReference(activity)
      val density = activity.resources.displayMetrics.density
      layoutJob = launch {
        WindowInfoTracker.getOrCreate(activity).windowLayoutInfo(activity).collect { layoutInfo ->
          val fold = layoutInfo.displayFeatures.filterIsInstance<FoldingFeature>().firstOrNull()
          update(fold?.let { describe(it, density) })
        }
      }
    }
  }

  private fun pause() {
    layoutJob?.cancel()
    layoutJob = null
    activity = null
  }

  private fun update(fold: Map<String, Any>?) {
    if (fold == currentFold) return
    currentFold = fold
    if (hasListeners) {
      sendEvent(FOLD_CHANGE_EVENT, mapOf("fold" to fold))
    }
  }

  private fun describe(fold: FoldingFeature, density: Float): Map<String, Any> {
    val bounds = fold.bounds
    return mapOf(
      "orientation" to if (fold.orientation == FoldingFeature.Orientation.VERTICAL) "vertical" else "horizontal",
      "state" to if (fold.state == FoldingFeature.State.HALF_OPENED) "halfOpened" else "flat",
      // In density-independent pixels, relative to the window.
      "bounds" to mapOf(
        "x" to bounds.left / density,
        "y" to bounds.top / density,
        "width" to bounds.width() / density,
        "height" to bounds.height() / density
      )
    )
  }
}
