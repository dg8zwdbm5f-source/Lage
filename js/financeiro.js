let chartPizza = null;
let chartBarras = null;
let dadosGlobais = [];

document.addEventListener("DOMContentLoaded", async () => {
    const statusDiv = document.getElementById("status-conexao");
    
    if (typeof carregarDados !== "function") {
        console.error("A função carregarDados() não foi encontrada. Verifique o arquivo api.js");
        statusDiv.innerHTML = '<span style="color: #f75a68;">❌ Erro crítico: Script de API não carregado.</span>';
        return;
    }

    try {
        dadosGlobais = await carregarDados();
        
        if (!dadosGlobais || dadosGlobais.length === 0) {
            statusDiv.innerHTML = '<span style="color: #ffb800;">⚠ Planilha conectada, mas nenhum dado foi retornado.</span>';
            return;
        }

        statusDiv.style.display = "none";

        if (typeof inicializarFiltros === "function") {
            inicializarFiltros(dadosGlobais);
        }

        processarPainel(dadosGlobais);

    } catch (erro) {
        console.error("Erro ao carregar dados do painel:", erro);
        statusDiv.innerHTML = '<span style="color: #f75a68;">❌ Falha na comunicação com o Google Sheets.</span>';
    }
});

function processarPainel(dadosParaExibir) {
    let totalGasto = 0;
    let totalPago = 0;
    let totalPendente = 0;
    
    const linhasTabela = [];
    const categoriasObj = {};
    const centrosObj = {};
    const mesesAbreviados = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    dadosParaExibir.forEach(item => {
        const totalParcelas = parseInt(item.parcela) || 1;
        const valorParcela = Number(item.valor) || 0;
        
        let dataTexto = item.dataCompra ? item.dataCompra.toString().trim() : "";
        
        // Valores padrão caso falhe o parse
        let diaBase = 1;
        let mesBase = new Date().getMonth();
        let anoBase = new Date().getFullYear();

        // --- TRATAMENTO ROBUSTO DE DATA (ISO OU PT-BR) ---
        if (dataTexto) {
            // Se vier no formato ISO completo (ex: 2026-05-29T03:00:00.000Z), limpa a hora
            if (dataTexto.includes("T")) {
                dataTexto = dataTexto.split("T")[0];
            }
            
            if (dataTexto.includes("-")) {
                const partes = dataTexto.split("-");
                if (partes.length === 3) {
                    anoBase = parseInt(partes[0]);
                    mesBase = parseInt(partes[1]) - 1; // Meses no JS vão de 0 a 11
                    diaBase = parseInt(partes[2]);
                }
            } else if (dataTexto.includes("/")) {
                const partes = dataTexto.split("/");
                if (partes.length === 3) {
                    diaBase = parseInt(partes[0]);
                    mesBase = parseInt(partes[1]) - 1;
                    anoBase = parseInt(partes[2]);
                }
            }
        }

        // Reconstrói a Data de Compra no padrão visual DD/MM/AAAA limpo
        const dataCompraFormatada = `${String(diaBase).padStart(2, '0')}/${String(mesBase + 1).padStart(2, '0')}/${anoBase}`;

        // --- AJUSTE DE VENCIMENTO DO GOOGLE SHEETS ---
        // Lendo o campo vencimento enviado pela planilha para alinhar o primeiro mês
        let vencimentoTexto = item.vencimento ? item.vencimento.toString().trim() : "";
        let mesVencimentoBase = mesBase; 
        let anoVencimentoBase = anoBase;

        if (vencimentoTexto) {
            if (vencimentoTexto.includes("T")) vencimentoTexto = vencimentoTexto.split("T")[0];
            
            if (vencimentoTexto.includes("-")) {
                const partesV = vencimentoTexto.split("-");
                if (partesV.length === 3) {
                    anoVencimentoBase = parseInt(partesV[0]);
                    mesVencimentoBase = parseInt(partesV[1]) - 1;
                }
            } else if (vencimentoTexto.includes("/")) {
                const partesV = vencimentoTexto.split("/");
                if (partesV.length === 3) {
                    // Trata se for DD/MM/AAAA ou MM/AAAA
                    mesVencimentoBase = parseInt(partesV[1]) - 1;
                    anoVencimentoBase = parseInt(partesV[2]);
                }
            }
        } else {
            // Se não houver coluna de vencimento preenchida, assume o mês seguinte ao da compra
            mesVencimentoBase = mesBase + 1;
        }

        // Loop gerador de parcelas baseado na data real de vencimento da planilha
        for (let i = 0; i < totalParcelas; i++) {
            // Cria a data da parcela respeitando o mês e ano corretos de vencimento informados
            let dataParcela = new Date(anoVencimentoBase, mesVencimentoBase + i, 1);
            
            const mesNome = mesesAbreviados[dataParcela.getMonth()];
            const anoNum = dataParcela.getFullYear();
            const vencimentoFormatado = `${mesNome}-${anoNum}`;

            if (typeof filtrarLinhaIndividual === "function") {
                if (!filtrarLinhaIndividual(mesNome, anoNum, item.conta, item.status, i, item)) {
                    continue;
                }
            }

            totalGasto += valorParcela;

            let statusParcela = item.status ? item.status.trim().toLowerCase() : "pendente";
            let statusBadgeTexto = item.status || "Pendente";
            
            if (i > 0) {
                statusParcela = "pendente";
                statusBadgeTexto = "Pendente";
            }

            if (statusParcela === "pago") {
                totalPago += valorParcela;
            } else {
                totalPendente += valorParcela;
            }

            const descricaoCustomizada = totalParcelas > 1 
                ? `${item.descricao || "Sem descrição"} (${i + 1}/${totalParcelas})`
                : (item.descricao || "-");

            const subcategoria = item.subcategoria && item.subcategoria.trim() !== "" ? item.subcategoria.trim() : "Outros";
            const centroCusto = item.centroCusto && item.centroCusto.trim() !== "" ? item.centroCusto.trim() : "Geral";
            
            categoriasObj[subcategoria] = (categoriasObj[subcategoria] || 0) + valorParcela;
            centrosObj[centroCusto] = (centrosObj[centroCusto] || 0) + valorParcela;

            linhasTabela.push(`
                <tr>
                    <td>${dataCompraFormatada}</td>
                    <td><strong>${vencimentoFormatado}</strong></td>
                    <td>${item.fornecedor || "-"}</td>
                    <td>${descricaoCustomizada}</td>
                    <td>R$ ${valorParcela.toFixed(2).replace(".", ",")}</td>
                    <td>${item.conta || "-"}</td>
                    <td><span class="status-badge ${statusParcela}">${statusBadgeTexto}</span></td>
                </tr>
            `);
        }
    });

    document.getElementById("tabelaCorpo").innerHTML = linhasTabela.join("");
    document.getElementById("totalGasto").innerText = "R$ " + totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    document.getElementById("qtdeLancamentos").innerText = linhasTabela.length;
    document.getElementById("totalPago").innerText = "R$ " + totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    document.getElementById("totalPendente").innerText = "R$ " + totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

    atualizarGraficosPainel(categoriasObj, centrosObj);
}

function atualizarGraficosPainel(categoriasObj, centrosObj) {
    const coresDinamicas = ['#633bbc', '#00b37e', '#f75a68', '#ffb800', '#00d2df', '#ff79c6', '#50fa7b', '#ffb86c'];

    try {
        const ctxPizza = document.getElementById('graficoSubcategorias').getContext('2d');
        if (chartPizza) chartPizza.destroy();
        chartPizza = new Chart(ctxPizza, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoriasObj),
                datasets: [{ data: Object.values(categoriasObj), backgroundColor: coresDinamicas, borderWidth: 2, borderColor: '#1a1a1e' }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#c4c4cc' } } } }
        });
    } catch (err) { console.error(err); }

    try {
        const ctxBarras = document.getElementById('graficoCentroCusto').getContext('2d');
        if (chartBarras) chartBarras.destroy();
        chartBarras = new Chart(ctxBarras, {
            type: 'bar',
            data: {
                labels: Object.keys(centrosObj),
                datasets: [{ data: Object.values(centrosObj), backgroundColor: '#633bbc', borderRadius: 4 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#c4c4cc' } },
                    y: { grid: { color: '#29292e' }, ticks: { color: '#c4c4cc' } }
                }
            }
        });
    } catch (err) { console.error(err); }
}
