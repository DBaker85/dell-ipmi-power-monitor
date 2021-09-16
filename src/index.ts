import koa from "koa";
import KoaRouter from "koa-router";
import { exec } from "child_process";

const ipmiCommand = `ipmitool -I lanplus -H 192.168.2.36 -U root -P pass delloem powermonitor powerconsumptionhistory | grep "Average Power Consumption" | awk '{print $4}'`;

const read = async () => {
  const power = await exec(ipmiCommand);
  console.log(power);
};

// read()

const app = new koa();
const router = new KoaRouter();

router.get("server-power", "/api/server-power", (context) => {
  context.body = { power: 500, unit: "kWh" };
});

router.get("root", "/", (context) => {
  context.throw(500, "Sample error message");
});

app.use(router.routes()).use(router.allowedMethods());
app.listen(5878);
