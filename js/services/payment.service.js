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

    // =====================================================
    // CREAR PAGO
    // =====================================================

    async createPayment(paymentData) {

        const { data, error } = await supabase
            .from("payments")
            .insert([paymentData])
            .select()
            .single();

        return {
            data,
            error
        };
    }


    // =====================================================
    // OBTENER PAGOS DE UN NEGOCIO
    // =====================================================

    async getPaymentsByBusiness(businessId) {

        const { data, error } = await supabase
            .from("payments")
            .select("*")
            .eq("business_id", businessId)
            .order("created_at", { ascending: false });

        return {
            data: data || [],
            error
        };
    }


    // =====================================================
    // OBTENER UN PAGO POR ID
    // =====================================================

    async getPaymentById(paymentId) {

        const { data, error } = await supabase
            .from("payments")
            .select("*")
            .eq("id", paymentId)
            .single();

        return {
            data,
            error
        };
    }


    // =====================================================
    // OBTENER PAGOS PENDIENTES DE UN NEGOCIO
    // =====================================================

    async getPendingPaymentsByBusiness(businessId) {

        const { data, error } = await supabase
            .from("payments")
            .select("*")
            .eq("business_id", businessId)
            .eq("status", "PENDIENTE")
            .order("created_at", { ascending: false });

        return {
            data: data || [],
            error
        };
    }


    // =====================================================
    // ACTUALIZAR PAGO
    // =====================================================

    async updatePayment(paymentId, paymentData) {

        const { data, error } = await supabase
            .from("payments")
            .update(paymentData)
            .eq("id", paymentId)
            .select()
            .single();

        return {
            data,
            error
        };
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
        paidAt = null
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
            paid_at: paidAt
        });
    }


    // =====================================================
    // VERIFICAR PAGO
    // =====================================================
    // La activación del negocio se implementará en una capa
    // transaccional posterior. No se modifica businesses aquí
    // para evitar estados inconsistentes entre pago y activación.

    async verifyPayment(paymentId, verifiedBy) {

        return this.updatePayment(paymentId, {
            status: "VERIFICADO",
            verified_at: new Date().toISOString(),
            verified_by: verifiedBy
        });
    }

}


export default new PaymentService();
