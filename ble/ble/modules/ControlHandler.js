"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Characteristics_1 = require("../../protocol/Characteristics");
const Services_1 = require("../../protocol/Services");
const EncryptionHandler_1 = require("../../util/EncryptionHandler");
const ControlPackets_1 = require("../../protocol/ControlPackets");
const BluenetError_1 = require("../../BluenetError");
class ControlHandler {
    constructor(ble) {
        this.ble = ble;
    }

    setApp(app) {
        this.app = app;
        this.app.log("Set reference to Homey app in control handler");
    }

    getAndSetSessionNonce() {
        return this.ble.readCharacteristicWithoutEncryption(Services_1.CSServices.CrownstoneService, Characteristics_1.CrownstoneCharacteristics.SessionNonce)
            .then((rawNonce) => {
                this.app.log("Got nonce!");
                let decryptedNonce = EncryptionHandler_1.EncryptionHandler.decryptSessionNonce(rawNonce, this.ble.settings.guestKey);
                this.app.log("Decrypted nonce", decryptedNonce);
                this.ble.settings.setSessionNonce(decryptedNonce);
                this.app.log("Set nonce");
        })
            .catch((err) => {
                this.app.log("Could not validate session nonce");
//                if (err.type == BluenetError_1.BluenetErrorType.COULD_NOT_VALIDATE_SESSION_NONCE) {
                    throw err;
  //              }
        });
    }
    setSwitchState(state) {
        let switchState = state * 100;
        let packet = ControlPackets_1.ControlPacketsGenerator.getSwitchStatePacket(switchState);
        return this._writeControlPacket(packet);
    }
    commandFactoryReset() {
        let packet = ControlPackets_1.ControlPacketsGenerator.getCommandFactoryResetPacket();
        return this._writeControlPacket(packet);
    }
    disconnect() {
        let packet = ControlPackets_1.ControlPacketsGenerator.getDisconnectPacket();
        return this._writeControlPacket(packet)
            .then(() => {
            let sessionId = this.ble.connectionSessionId;
            setTimeout(() => {
                if (sessionId === this.ble.connectionSessionId) {
                    this.app.log("Forcing cleanup after disconnect command (just in case)");
                    if (this.ble.connectedPeripheral !== null) {
                        this.ble.connectedPeripheral = null;
                        this.ble.connectionPending = null;
                    }
                }
            }, 2000);
        });
    }
    _writeControlPacket(packet) {
        return this.ble.writeToCharacteristic(Services_1.CSServices.CrownstoneService, Characteristics_1.CrownstoneCharacteristics.Control, packet);
    }
}
exports.ControlHandler = ControlHandler;
//# sourceMappingURL=ControlHandler.js.map
