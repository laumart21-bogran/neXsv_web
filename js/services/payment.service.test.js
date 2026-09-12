import PaymentService from "./payment.service.js";

// Prueba estructural del servicio.
// No ejecuta llamadas a Supabase automáticamente.
// Se mantiene como referencia para las pruebas de integración.

console.assert(
    typeof PaymentService.createPayment === "function",
    "PaymentService.createPayment debe existir"
);

console.assert(
    typeof PaymentService.getPaymentsByBusiness === "function",
    "PaymentService.getPaymentsByBusiness debe existir"
);

console.assert(
    typeof PaymentService.getPendingPaymentsByBusiness === "function",
    "PaymentService.getPendingPaymentsByBusiness debe existir"
);

console.assert(
    typeof PaymentService.registerManualPayment === "function",
    "PaymentService.registerManualPayment debe existir"
);

console.assert(
    typeof PaymentService.verifyPayment === "function",
    "PaymentService.verifyPayment debe existir"
);
