/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/ctypes.jsm");

const RECOVERYSERVICE_CID = Components.ID("{b3caca5d-0bb0-48c6-912b-6be6cbf08832}");
const RECOVERYSERVICE_CONTRACTID = "@mozilla.org/recovery-service;1";

function log(msg) {
  dump("-*- RecoveryService: " + msg + "\n");
}

//@line 21 "/builds/slave/b2g_m-cen_flm-kk_eng_ntly-0000/build/gecko/b2g/components/RecoveryService.js"
let librecovery = (function() {
  let library;
  try {
    library = ctypes.open("librecovery.so");
  } catch (e) {
    log("Unable to open librecovery.so");
    throw Cr.NS_ERROR_FAILURE;
  }
  let FotaUpdateStatus = new ctypes.StructType("FotaUpdateStatus", [
                                                { result: ctypes.int },
                                                { updatePath: ctypes.char.ptr }
                                              ]);

  return {
    factoryReset:        library.declare("factoryReset",
                                         ctypes.default_abi,
                                         ctypes.int),
    installFotaUpdate:   library.declare("installFotaUpdate",
                                         ctypes.default_abi,
                                         ctypes.int,
                                         ctypes.char.ptr,
                                         ctypes.int),

    FotaUpdateStatus:    FotaUpdateStatus,
    getFotaUpdateStatus: library.declare("getFotaUpdateStatus",
                                         ctypes.default_abi,
                                         ctypes.int,
                                         FotaUpdateStatus.ptr)
  };
})();

const gFactoryResetFile = "__post_reset_cmd__";

//@line 55 "/builds/slave/b2g_m-cen_flm-kk_eng_ntly-0000/build/gecko/b2g/components/RecoveryService.js"

function RecoveryService() {}

RecoveryService.prototype = {
  classID: RECOVERYSERVICE_CID,
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIRecoveryService]),
  classInfo: XPCOMUtils.generateCI({
    classID: RECOVERYSERVICE_CID,
    contractID: RECOVERYSERVICE_CONTRACTID,
    interfaces: [Ci.nsIRecoveryService],
    classDescription: "B2G Recovery Service"
  }),

  factoryReset: function RS_factoryReset(reason) {
//@line 70 "/builds/slave/b2g_m-cen_flm-kk_eng_ntly-0000/build/gecko/b2g/components/RecoveryService.js"
    function doReset() {
      // If this succeeds, then the device reboots and this never returns
      if (librecovery.factoryReset() != 0) {
        log("Error: Factory reset failed. Trying again after clearing cache.");
      }
      let cache = Cc["@mozilla.org/netwerk/cache-storage-service;1"]
                    .getService(Ci.nsICacheStorageService);
      cache.clear();
      if (librecovery.factoryReset() != 0) {
        log("Error: Factory reset failed again");
      }
    }

    log("factoryReset " + reason);
    if (reason == "wipe") {
      let volumeService = Cc["@mozilla.org/telephony/volume-service;1"]
                          .getService(Ci.nsIVolumeService);
      let volNames = volumeService.getVolumeNames();
      log("Found " + volNames.length + " volumes");
      let text = "";
      for (let i = 0; i < volNames.length; i++) {
        let name = volNames.queryElementAt(i, Ci.nsISupportsString);
        let volume = volumeService.getVolumeByName(name.data);
        log("Got volume: " + name.data + " at " + volume.mountPoint);
        text += "wipe " + volume.mountPoint + "\n";
      }

      Cu.import("resource://gre/modules/osfile.jsm");
      let dir = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
      dir.initWithPath("/persist");
      var postResetFile = dir.exists() ?
                          OS.Path.join("/persist", gFactoryResetFile):
                          OS.Path.join("/cache", gFactoryResetFile);
      let encoder = new TextEncoder();
      let array = encoder.encode(text);
      let promise = OS.File.writeAtomic(postResetFile, array,
                                        { tmpPath: postResetFile + ".tmp" });

      promise.then(doReset, function onError(error) {
        log("Error: " + error);
      });
    } else {
      doReset();
    }
//@line 115 "/builds/slave/b2g_m-cen_flm-kk_eng_ntly-0000/build/gecko/b2g/components/RecoveryService.js"
    throw Cr.NS_ERROR_FAILURE;
  },

  installFotaUpdate: function RS_installFotaUpdate(updatePath) {
//@line 120 "/builds/slave/b2g_m-cen_flm-kk_eng_ntly-0000/build/gecko/b2g/components/RecoveryService.js"
    // If this succeeds, then the device reboots and this never returns
    if (librecovery.installFotaUpdate(updatePath, updatePath.length) != 0) {
      log("Error: FOTA install failed. Trying again after clearing cache.");
    }
    var cache = Cc["@mozilla.org/netwerk/cache-storage-service;1"].getService(Ci.nsICacheStorageService);
    cache.clear();
    if (librecovery.installFotaUpdate(updatePath, updatePath.length) != 0) {
      log("Error: FOTA install failed again");
    }
//@line 130 "/builds/slave/b2g_m-cen_flm-kk_eng_ntly-0000/build/gecko/b2g/components/RecoveryService.js"
    throw Cr.NS_ERROR_FAILURE;
  },

  getFotaUpdateStatus: function RS_getFotaUpdateStatus() {
    let status =  Ci.nsIRecoveryService.FOTA_UPDATE_UNKNOWN;
//@line 136 "/builds/slave/b2g_m-cen_flm-kk_eng_ntly-0000/build/gecko/b2g/components/RecoveryService.js"
    let cStatus = librecovery.FotaUpdateStatus();

    if (librecovery.getFotaUpdateStatus(cStatus.address()) == 0) {
      status = cStatus.result;
    }

//@line 143 "/builds/slave/b2g_m-cen_flm-kk_eng_ntly-0000/build/gecko/b2g/components/RecoveryService.js"
    return status;
  }
};

this.NSGetFactory = XPCOMUtils.generateNSGetFactory([RecoveryService]);
