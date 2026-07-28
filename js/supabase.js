/*=========================================
neXsv
Supabase Manager
=========================================*/

const SUPABASE_URL = "https://verswqljdxiaveicdtfq.supabase.co";

const SUPABASE_KEY = "sb_publishable_4jUefYv7Yd6Bw8q31IPTQQ_5eBgILOp";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

/*=========================================
Registrar usuario
=========================================*/
async function registerUser(nombre, correo, password){

    const { data, error } = await supabase.auth.signUp({

        email: correo,
        password: password

    });

    if(error){

        return{

            success:false,
            message:error.message

        };

    }

    async function loginUser(correo,password){

    const { data,error } =
    await supabase.auth.signInWithPassword({

        email:correo,
        password:password

    });

    if(error){

        return{

            success:false,
            message:error.message

        };

    }

    return{

        success:true,
        user:data.user

    };

}

    const { error: profileError } =
    await supabase
    .from("profiles")
    .insert({

        auth_user_id: data.user.id,
        nombre: nombre,
        email: correo

    });

    if(profileError){

        return{

            success:false,
            message:profileError.message

        };

    }

    return{

        success:true,
        user:data.user

    };

}

window.registerUser = registerUser;
window.loginUser = loginUser;
