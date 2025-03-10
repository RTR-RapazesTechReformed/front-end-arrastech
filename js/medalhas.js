export function obterMedalha(pontosTotais) {
    if (pontosTotais > 600) {
        return 'gold_medal.png';
    } else if (pontosTotais > 500) {
        return 'silver_medal.png';
    } else {
        return 'bronze_medal.png';
    }
}
