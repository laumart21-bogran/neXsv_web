import { supabase } from "../core/supabase-client.js";

/**
 * Servicio de pagos de neXsv.
 *
 * Este servicio NO depende de una pasarela específica.
 * Actualmente permite gestionar pagos manuales (transferencia,
 * efectivo u otro método) y deja preparada la capa para integrar
 * un proveedor como Wompi posteriormente.
 */
class PaymentService {

    async createPayment(paymentData) {
        const { data, error } = await supabase
            .from("payments")
            .insert([paymentData])
            .select()
            .single();

        return { data, error };
    }

    async getPaymentsByBusiness(businessId) {
        const { data, error } = await supabase
            .from("payments")
            .select("*")
            .eq("business_id", businessId)
            .order("created_at", { ascending: false });

        return { data: data || [], error };
    }

    async getPaymentById(paymentId) {
        const { data, error } = await supabase
            .from("payments")
            .select("*")
            .eq("id", paymentId)
            .single();

        return { data, error };
    }

    async getPendingPaymentsByBusiness(businessId) {
        const { data, error } = await supabase
            .from("payments")
            .select("*")
            .eq("business_id", businessId)
            .eq("status", "PENDIENTE")
            .order("created_at", { ascending: false });

        return { data: data || [], error };
    }

    async updatePayment(paymentId, paymentData) {
        const { data, error } = await supabase
            .from("payments")
            .update(paymentData)
            .eq("id", paymentId)
            .select()
            .single();

        return { data, error };
    }

    // =====================================================
    // REGISTRAR PAGO MANUAL
    // =====================================================

    async registerManualPayment({
        businessId,
        requestId,
        amount,
        method,
        reference = null,
        notes = null,
        paidOn = null
    }) {
        return this.createPayment({
            business_id: businessId,
            request_id: requestId,
            amount,
            currency: "USD",
            method,
            provider: "MANUAL",
            status: "PENDIENTE",
            reference,
            notes,
            paid_on: paidOn,
            paid_at: paidOn ? `${paidOn}T18:00:00.000Z` : null
        });
    }

    // =====================================================
    // VERIFICAR PAGO (compatibilidad)
    // =====================================================

    async verifyPayment(paymentId, verifiedBy) {
        return this.updatePayment(paymentId, {
            status: "VERIFICADO",
            verified_at: new Date().toISOString(),
            verified_by: verifiedBy
        });
    }

    // =====================================================
    // VERIFICAR PAGO Y ACTIVAR NEGOCIO
    // =====================================================

    async verifyPaymentAndActivateBusiness(paymentId) {
        const { data, error } = await supabase.rpc(
            "verify_payment_and_activate_business",
            { p_payment_id: paymentId }
        );

        return { data, error };
    }
}

export default new PaymentService();
