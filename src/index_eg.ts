import { execSync } from "child_process";
import { readJSON } from "fs-extra";
import { resolve } from "path";
import fetch from "node-fetch";

import { timer } from "rxjs";
import { concatMap } from "rxjs/operators";
import ora from "ora";
import { cyan, green, red, yellowBright } from "chalk";

import { manualMode, fanSpeed8, fan5Off, autoMode } from "./ipmiCommands";
import { getHighestTemp } from "./utils";
import { SecretsType } from "./types";
import { IpmiIp, IpmiUser, IpmiPassword, glancesIp } from "../secrets.json";

const tempThreshold = 60;
let automode = "on";
let sendingCommands = false;
const spinner = ora("Begin monitoring");

(async () => {
  try {
    console.log(`Config found, Initializing control`);
    sendingCommands = true;
    console.log(`Setting ${cyan("Manual")} mode`);
    execSync(
      `ipmitool -I lanplus -H ${IpmiIp} -U ${IpmiUser} -P ${IpmiPassword} ${manualMode}`
    );
    console.log(`Setting ${cyan("Fans")} to ${green("15%")}`);
    execSync(
      `ipmitool -I lanplus -H ${IpmiIp} -U ${IpmiUser} -P ${IpmiPassword} ${fanSpeed8}`
    );
    console.log(`Setting ${cyan("Fan 5")} to ${green("1%")}`);
    execSync(
      `ipmitool -I lanplus -H ${IpmiIp} -U ${IpmiUser} -P ${IpmiPassword} ${fan5Off}`
    );

    automode = "off";
    sendingCommands = false;
    spinner.start();
    timer(1, 5000)
      .pipe(
        concatMap(async () => {
          const res = await fetch(`http://${glancesIp}/api/3/all`, {
            method: "GET",
          });
          const json = await res.json();

          return getHighestTemp(json);
        })
      )
      .subscribe((temp: number) => {
        if (sendingCommands === false) {
          if (automode === "off" && temp > tempThreshold) {
            console.log(
              `Threshold ${red("Exceeded")}, setting ${yellowBright(
                "Auto"
              )} mode`
            );
            sendingCommands = true;
            execSync(
              `ipmitool -I lanplus -H ${IpmiIp} -U ${IpmiUser} -P ${IpmiPassword} ${autoMode}`
            );
            automode = "on";
            sendingCommands = false;
          }
          if (automode === "on" && temp < tempThreshold) {
            console.log(
              `Temperatures within safe limits, setting ${cyan("Manual")} mode`
            );
            sendingCommands = true;
            execSync(
              `ipmitool -I lanplus -H ${IpmiIp} -U ${IpmiUser} -P ${IpmiPassword} ${manualMode}`
            );
            console.log(`Setting ${cyan("fans")} to ${green("15%")}`);
            execSync(
              `ipmitool -I lanplus -H ${IpmiIp} -U ${IpmiUser} -P ${IpmiPassword} ${fanSpeed8}`
            );
            console.log(`Setting ${cyan("fan 5")} to ${green("1%")}`);
            execSync(
              `ipmitool -I lanplus -H ${IpmiIp} -U ${IpmiUser} -P ${IpmiPassword} ${fan5Off}`
            );

            automode = "off";
            sendingCommands = false;
          }
        }
      });
  } catch (err) {
    console.error(err);
    spinner.fail(err);
    process.exit(1);
  }
})();
