document.addEventListener("DOMContentLoaded", () => {
  const btEl = document.getElementById("bt");
  const btOffEl = document.getElementById("bt-off");
  const btBatEl = document.getElementById("bt-bat-info");
  const btDevInfoEl = document.getElementById("bt-dev-info");

  const bt = {
    device: null,
    server: null,
    services: {},
    characteristics: {},
  };

  btEl.addEventListener("click", () => {
    const navBt = window.navigator.bluetooth;
    if (!navBt) return;

    navBt
      .requestDevice({
        acceptAllDevices: true,
        optionalServices: ["device_information"],
      })
      .then((device) => {
        // Human-readable name of the device.
        console.log(`device name: ${device.name}`);

        // set info
        bt.device = device;

        // add listener on disconnected
        device.addEventListener("gattserverdisconnected", onDisconnected);

        // Attempts to connect to remote GATT Server.
        return device.gatt.connect();
      })
      .then((server) => {
        bt.server = server;
      })
      .catch((error) => {
        console.error(error);
      });
  });

  btOffEl.addEventListener("click", () => {
    bt.device.gatt.disconnect();
  });

  btBatEl.addEventListener("click", () => {
    bt.server
      .getPrimaryService("battery_service")
      .then((service) => {
        bt.services.battery_service = service;

        // Getting Battery Level Characteristic…
        return service.getCharacteristic("battery_level");
      })
      .then((characteristic) => {
        bt.characteristics.battery_level = characteristic;

        // Reading Battery Level…
        return characteristic.readValue();
      })
      .then((value) => {
        setInfo(btBatEl, value.getUint8(0));
      })
      .catch((error) => {
        console.error(error);
      });
  });

  btDevInfoEl.addEventListener("click", () => {
    bt.server
      .getPrimaryService("device_information")
      .then((service) => {
        bt.services.device_information = service;
        return service.getCharacteristics();
      })
      .then((characteristics) => {
        const characteristicsInfo = {};

        characteristics.forEach((characteristic) => {
          switch (characteristic.uuid) {
            case BluetoothUUID.getCharacteristic("manufacturer_name_string"):
              characteristicsInfo["manufacturer_name_string"] = characteristic;
              break;

            case BluetoothUUID.getCharacteristic("model_number_string"):
              characteristicsInfo["model_number_string"] = characteristic;
              break;

            case BluetoothUUID.getCharacteristic("hardware_revision_string"):
              characteristicsInfo["hardware_revision_string"] = characteristic;
              break;

            case BluetoothUUID.getCharacteristic("firmware_revision_string"):
              characteristicsInfo["firmware_revision_string"] = characteristic;
              break;

            case BluetoothUUID.getCharacteristic("software_revision_string"):
              characteristicsInfo["software_revision_string"] = characteristic;
              break;

            case BluetoothUUID.getCharacteristic("system_id"):
              characteristicsInfo["system_id"] = characteristic;
              break;

            case BluetoothUUID.getCharacteristic(
              "ieee_11073-20601_regulatory_certification_data_list"
            ):
              characteristicsInfo[
                "ieee_11073-20601_regulatory_certification_data_list"
              ] = characteristic;
              break;

            case BluetoothUUID.getCharacteristic("pnp_id"):
              characteristicsInfo["pnp_id"] = characteristic;
              break;

            default:
              console.log("> Unknown Characteristic: " + characteristic.uuid);
          }
        });

        return characteristicsInfo;
      })
      .then((characteristics) => {
        const decoder = new TextDecoder("utf-8");
        const promises = [];

        Object.entries(characteristics).forEach(([k, v]) => {
          switch (k) {
            case "manufacturer_name_string":
              promises.push(
                new Promise((res, rej) => {
                  v.readValue().then((value) => {
                    res("> Manufacturer Name String: " + decoder.decode(value));
                  });
                })
              );

              break;

            case "model_number_string":
              promises.push(
                new Promise((res, rej) => {
                  v.readValue().then((value) => {
                    res("> Model Number String: " + decoder.decode(value));
                  });
                })
              );
              break;

            case "hardware_revision_string":
              promises.push(
                new Promise((res, rej) => {
                  v.readValue().then((value) => {
                    res("> Hardware Revision String: " + decoder.decode(value));
                  });
                })
              );
              break;

            case "firmware_revision_string":
              promises.push(
                new Promise((res, rej) => {
                  v.readValue().then((value) => {
                    res("> Firmware Revision String: " + decoder.decode(value));
                  });
                })
              );
              break;

            case "software_revision_string":
              promises.push(
                new Promise((res, rej) => {
                  v.readValue().then((value) => {
                    res("> Software Revision String: " + decoder.decode(value));
                  });
                })
              );
              break;

            case "system_id":
              promises.push(
                new Promise((res, rej) => {
                  v.readValue().then((value) => {
                    let str = "> System ID: ";

                    str += "  > Manufacturer Identifier: ";
                    str +=
                      padHex(value.getUint8(4)) +
                      padHex(value.getUint8(3)) +
                      padHex(value.getUint8(2)) +
                      padHex(value.getUint8(1)) +
                      padHex(value.getUint8(0));

                    str += "  > Organizationally Unique Identifier: ";
                    str +=
                      padHex(value.getUint8(7)) +
                      padHex(value.getUint8(6)) +
                      padHex(value.getUint8(5));
                    res(str);
                  });
                })
              );
              break;

            case "ieee_11073-20601_regulatory_certification_data_list":
              promises.push(
                new Promise((res, rej) => {
                  v.readValue().then((value) => {
                    res(
                      "> IEEE 11073-20601 Regulatory Certification Data List: " +
                        decoder.decode(value)
                    );
                  });
                })
              );
              break;

            case "pnp_id":
              promises.push(
                new Promise((res, rej) => {
                  v.readValue().then((value) => {
                    let str = "> PnP ID:";

                    str +=
                      "  > Vendor ID Source: " +
                      (value.getUint8(0) === 1 ? "Bluetooth" : "USB");

                    if (value.getUint8(0) === 1) {
                      str +=
                        "  > Vendor ID: " +
                        (value.getUint8(1) | (value.getUint8(2) << 8));
                    }
                    str +=
                      "  > Product ID: " +
                      (value.getUint8(3) | (value.getUint8(4) << 8));

                    str +=
                      "  > Product Version: " +
                      (value.getUint8(5) | (value.getUint8(6) << 8));

                    res(str);
                  });
                })
              );
              break;

            default:
              console.log("> Unknown Characteristic: " + characteristic.uuid);
          }
        });

        return promises;
      })
      .then((promises) => {
        return Promise.all(promises);
      })
      .then((results) => {
        setInfo(btDevInfoEl, results.join("\n"));
      })
      .catch((error) => {
        console.error(error);
      });
  });
});

function onDisconnected(event) {
  const device = event.target;
  console.log(`Device ${device.name} is disconnected.`);
}

function setInfo(element, info) {
  element.parentElement.querySelector("span").textContent = info;
}

function padHex(value) {
  return ("00" + value.toString(16).toUpperCase()).slice(-2);
}
