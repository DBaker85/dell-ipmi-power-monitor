import koa from "koa";
import KoaRouter from "koa-router";
import { exec as ChildExec } from "child_process";
import util from "util";

import { IpmiIp, IpmiUser, IpmiPassword } from "../secrets.json";

const exec = util.promisify(ChildExec);

const ipmiCommand = `ipmitool -I lanplus -H ${IpmiIp} -U ${IpmiUser} -P ${IpmiPassword} delloem powermonitor powerconsumptionhistory | grep "Average Power Consumption" | awk '{print $4}'`;

const app = new koa();
const router = new KoaRouter();

router.get("server-power", "/api/server-power", async (context) => {
  const response = await exec(ipmiCommand);
  const power = +response.stdout;
  context.body = { power, unit: "W" };
});

router.get("root", "/", (context) => {
  context.throw(500, "Sample error message");
});

app.use(router.routes()).use(router.allowedMethods());
app.listen(5878);
console.log("app running on port 5878");
