let chartPizza = null;
let chartBarras = null;

function renderizarGraficos(dados) {
    const categoriasObj = {};
    const centrosObj = {};

    // 1. Agrupar e somar os valores
    dados.forEach(item => {
        const valor = Number(item.valor) || 0;
        const subcategoria = item.subcategoria || "Outros";
        const centroCusto = item.centroCusto || "Geral";

        categoriasObj[subcategoria] = (categoriasObj[subcategoria] || 0) + valor;
        centrosObj[centroCusto] = (centrosObj[centroCusto] || 0) + valor;
    });

    // Paleta de Cores Modo Escuro
    const coresDinamicas = [
        '#633bbc', '#00b37e', '#f75a68', '#ffb800', 
        '#00d2df', '#ff79c6', '#50fa7b', '#ffb86c'
    ];

    // --- Configuração: Gráfico de Rosca (Subcategorias) ---
    const ctxPizza = document.getElementById('graficoSubcategorias').getContext('2d');
    if (chartPizza) chartPizza.destroy();
    
    chartPizza = new Chart(ctxPizza, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoriasObj),
            datasets: [{
                data: Object.values(categoriasObj),
                backgroundColor: coresDinamicas,
                borderWidth: 2,
                borderColor: '#1a1a1e'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'right', 
                    labels: { color: '#c4c4cc', font: { size: 11 } } 
                }
            }
        }
    });

    // --- Configuração: Gráfico de Barras (Centro de Custo) ---
    const ctxBarras = document.getElementById('graficoCentroCusto').getContext('2d');
    if (chartBarras) chartBarras.destroy();

    chartBarras = new Chart(ctxBarras, {
        type: 'bar',
        data: {
            labels: Object.keys(centrosObj),
            datasets: [{
                label: 'Gasto por Centro (R$)',
                data: Object.values(centrosObj),
                backgroundColor: '#633bbc',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#c4c4cc' } },
                y: { grid: { color: '#29292e' }, ticks: { color: '#c4c4cc' } }
            }
        }
    });
}
