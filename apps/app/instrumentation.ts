import { registerOTel } from "@vercel/otel";

registerOTel({ serviceName: "thoughtbase-app" });
