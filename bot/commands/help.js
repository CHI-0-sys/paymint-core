function normalizePhone(jid) {
  return jid.replace(/@s\.whatsapp\.net$/, "");
}

async function handleHelp(sock, from) {
  const phone = normalizePhone(from); // if needed later

  const text = `👋🏽 *Welcome to Paymint Bot!*

Here’s what I can do for your business:

📦 */receipt*  
Send itemized sales like this:  
Pants - 2500  
Top - 4000  
Shoes - 7000  
Customer: John  
Note: Paid POS

📊 */sales today*  
Shows today’s total sales.
 
*/email*
to add business email , for authentication and subscription 

*/reset*
to reset business if the case may arise but sales record wwill be saved and kept in tack 



📆 */sales month*  
See your monthly sales total.

💳 */subscribe*  
Upgrade to Premium for logo & receipt image. 

?*/pay*
 to choose your best payment option , secure and fast subscription method 

❓ */help*  
You're here already 😊

—

🎯 Let’s simplify your sales life.  
Built for Naija vendors, by Naija minds 🇳🇬💚`;

  return sock.sendMessage(from, { text });
}

module.exports = { handleHelp };