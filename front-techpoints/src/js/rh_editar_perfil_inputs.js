function adicionarNovoNumero() {
    document.getElementById('novo_telefone').addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, ''); 
        value = value.replace(/^(\d{2})(\d)/, '($1) $2'); 
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
        e.target.value = value;
    });
}

document.addEventListener('DOMContentLoaded', function() {
    adicionarNovoNumero();
});

function showTooltip(event, text) {
    var tooltip = document.getElementById('tooltip');
    tooltip.textContent = text;
    tooltip.style.opacity = 1;
    tooltip.style.left = event.pageX + 'px';
    tooltip.style.top = (event.pageY + 20) + 'px';
}

function hideTooltip() {
    var tooltip = document.getElementById('tooltip');
    tooltip.style.opacity = 0;
}
