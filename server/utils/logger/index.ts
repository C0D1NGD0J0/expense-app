import bunyan from "bunyan";

export const createLogger = (name: string) => {
  return bunyan.createLogger({ name, level: "debug" });
};
