const handleReceiptCommand = require("../commands/receipt");

if (body.startsWith("/receipt")) {
  return await handleReceiptCommand(sock, from, args, db);
}
