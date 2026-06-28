const API_URL = "https://script.google.com/macros/s/AKfycbyEDIgA6d7lyOUcApoZrhMICiINv7U5_QjG67_8jAMDLvhAXHCWK-LJCFdmCvLkPAy_/exec";

async function carregarDados() {
    try {
        const resposta = await fetch(API_URL);
        if (!resposta.ok) {
            throw new Error(`Erro na requisição: ${resposta.status}`);
        }
        return await resposta.json();
    } catch (erro) {
        console.error("Erro ao buscar dados da planilha:", erro);
        return [];
    }
}
