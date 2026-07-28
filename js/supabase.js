/* ==========================================
   neXsv - Supabase
========================================== */

const SUPABASE_URL = "https://verswqljdxiaveicdtfq.supabase.co
";

const SUPABASE_KEY =
"sb_publishable_4jUefYv7Yd6Bw8q31IPTQQ_5eBgILOp";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

/* ==========================================
   REGISTRO
========================================== */

async function registerUser(nombre, correo, password) {

    try {

        const { data, error } = await supabase.auth.signUp({

            email: correo,
            password: password,

            options: {

                data: {
                    nombre: nombre
                }

            }

        });

        if (error) {

            return {
                success: false,
                message: error.message
            };

        }

        const user = data.user;

        if (!user) {

            return {
                success: false,
                message: "No fue posible crear el usuario."
            };

        }

        const { error: profileError } = await supabase
            .from("profiles")
            .insert([{

                auth_user_id: user.id,
                nombre: nombre,
                email: correo,
                tipo_usuario: "usuario"

            }]);

        if (profileError) {

            return {
                success: false,
                message: profileError.message
            };

        }

        return {

            success: true,
            user

        };

    } catch (err) {

        return {

            success: false,
            message: err.message

        };

    }

}

/* ==========================================
   LOGIN
========================================== */

async function loginUser(correo, password) {

    try {

        const { data, error } =
            await supabase.auth.signInWithPassword({

                email: correo,
                password: password

            });

        if (error) {

            return {

                success: false,
                message: error.message

            };

        }

        return {

            success: true,
            user: data.user

        };

    } catch (err) {

        return {

            success: false,
            message: err.message

        };

    }

}

/* ==========================================
   SESION ACTUAL
========================================== */

async function getCurrentUser() {

    const {

        data: { user }

    } = await supabase.auth.getUser();

    return user;

}

/* ==========================================
   LOGOUT
========================================== */

async function logoutUser() {

    await supabase.auth.signOut();

}
