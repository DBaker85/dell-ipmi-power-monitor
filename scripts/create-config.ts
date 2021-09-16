import prompts, { PromptObject } from "prompts";
import { writeJSON } from "fs-extra";

(async () => {
  const questions: PromptObject[] = [
    {
      type: "text",
      name: "IpmiIp",
      message: `Enter the ip adress for ipmi control`,
    },
    {
      type: "text",
      name: "IpmiUser",
      message: "Enter your ipmi user name",
    },
    {
      type: "text",
      name: "IpmiPassword",
      message: "Enter your Ipmi password",
    },
  ];
  const response = await prompts(questions);
  await writeJSON("secrets.json", response);
  process.exit(0);
})();
