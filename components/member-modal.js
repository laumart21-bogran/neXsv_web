(function () {

const modal = `

<div id="memberModal" class="member-modal-overlay">

    <div class="member-modal">

        <div class="member-icon">
            🤝
        </div>

        <h2>Forma parte de la comunidad neXsv</h2>

        <p class="member-description">

            Este negocio forma parte de una red privada basada en confianza entre familias y negocios.

        </p>

        <div class="member-benefits">

            <div>✅ Ver la información completa de los negocios.</div>
            <div>✅ Contactarlos directamente por WhatsApp.</div>
            <div>✅ Conocer su ubicación y cómo llegar.</div>
            <div>✅ Leer y compartir recomendaciones.</div>
            <div>✅ Acceder a beneficios exclusivos para miembros.</div>

        </div>

        <div class="member-counter">

            👨‍👩‍👧

            <strong>

                Próximamente miles de familias formarán parte de esta comunidad.

            </strong>

        </div>

        <button class="member-primary">

            Unirme gratis

        </button>

        <button class="member-secondary">

            Ya soy miembro

        </button>

    </div>

</div>

`;

document.body.insertAdjacentHTML("beforeend", modal);

window.showMemberModal = function(){

    document
        .getElementById("memberModal")
        .classList.add("show");

}

window.hideMemberModal = function(){

    document
        .getElementById("memberModal")
        .classList.remove("show");

}

})();
