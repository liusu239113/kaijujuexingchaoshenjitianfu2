(function (win) {
  "use strict";

  if (!Object.fromEntries) {
    var fromEntries = function (iterable) {
      if (iterable == null) throw new TypeError("Object.fromEntries requires an iterable");
      var result = {};
      var iteratorMethod = typeof Symbol !== "undefined" && Symbol.iterator && iterable[Symbol.iterator];
      if (iteratorMethod) {
        var iterator = iteratorMethod.call(iterable);
        var step;
        while (!(step = iterator.next()).done) {
          var entry = step.value;
          if (!entry || typeof entry !== "object") throw new TypeError("Iterator value is not an entry object");
          result[entry[0]] = entry[1];
        }
        return result;
      }
      for (var index = 0; index < iterable.length; index += 1) {
        var pair = iterable[index];
        if (!pair || typeof pair !== "object") throw new TypeError("Iterator value is not an entry object");
        result[pair[0]] = pair[1];
      }
      return result;
    };
    try {
      Object.defineProperty(Object, "fromEntries", {
        configurable: true,
        writable: true,
        value: fromEntries,
      });
    } catch (error) {
      Object.fromEntries = fromEntries;
    }
  }

  var boot = {
    ready: false,
    failed: false,
    timer: null,
  };
  win.__DIVINE_TALENT_BOOT__ = boot;

  function errorMessage(value) {
    if (!value) return "未能完成首屏加载";
    if (typeof value === "string") return value;
    if (value.message) return String(value.message);
    return String(value);
  }

  function showBootFailure(detail) {
    if (boot.ready || boot.failed) return;
    boot.failed = true;
    if (boot.timer) win.clearTimeout(boot.timer);
    var loading = win.document.getElementById("boot-loading-copy");
    var failure = win.document.getElementById("boot-failure-copy");
    var errorDetail = win.document.getElementById("boot-error-detail");
    var retry = win.document.getElementById("boot-retry");
    if (loading) loading.hidden = true;
    if (failure) failure.hidden = false;
    if (errorDetail) errorDetail.textContent = "错误信息：" + errorMessage(detail).slice(0, 240);
    if (retry) retry.onclick = function () { win.location.reload(); };
  }

  win.markDivineTalentReady = function () {
    boot.ready = true;
    if (boot.timer) win.clearTimeout(boot.timer);
  };

  if (win.addEventListener) {
    win.addEventListener("error", function (event) {
      showBootFailure(event && (event.error || event.message));
    });
    win.addEventListener("unhandledrejection", function (event) {
      showBootFailure(event && event.reason);
    });
  }

  boot.timer = win.setTimeout(function () {
    showBootFailure("启动超时，请检查系统 WebView 是否已更新");
  }, 15000);
})(window);
