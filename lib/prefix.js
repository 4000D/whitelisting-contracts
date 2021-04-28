const appendHexPrefix = (s = "") => (s.startsWith("0x") ? s : "0x" + s);
const removeHexPrefix = (s = "") => (s.startsWith("0x") ? s.slice(2) : s);

module.exports = {
  appendHexPrefix,
  removeHexPrefix,
};
