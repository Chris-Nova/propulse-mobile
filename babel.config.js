module.exports = function (api) {
  api.cache(true);

  const expoRouterPlugin = () => ({
    visitor: {
      MemberExpression(nodePath) {
        try {
          const obj = nodePath.get("object");
          const prop = nodePath.get("property");
          if (
            obj.isMemberExpression() &&
            obj.get("object").isIdentifier({ name: "process" }) &&
            obj.get("property").isIdentifier({ name: "env" })
          ) {
            const name = prop.node.name;
            if (name === "EXPO_ROUTER_APP_ROOT") {
              nodePath.replaceWith({ type: "StringLiteral", value: "../../app" });
            } else if (name === "EXPO_ROUTER_IMPORT_MODE") {
              nodePath.replaceWith({ type: "StringLiteral", value: "sync" });
            }
          }
        } catch (e) {}
      },
    },
  });

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      expoRouterPlugin,
      "react-native-reanimated/plugin",
    ],
  };
};
