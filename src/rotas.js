const express = require('express');
const { verificaSenhaBanco, verificaSenhaUsuario } = require('./intermediarios');
const {
    listarContas,
    criarConta,
    atualizarUsuario,
    excluirConta,
    depositar,
    sacar,
    transferir,
    consultarSaldo,
    emitirExtrato
} = require('./controladores/banco');

const rotas = express();

rotas.get('/contas', verificaSenhaBanco, listarContas);
rotas.post('/contas', criarConta);
rotas.put('/contas/:numeroConta/usuario', atualizarUsuario);
rotas.delete('/contas/:numeroConta', excluirConta);
rotas.post('/transacoes/depositar', depositar);
rotas.post('/transacoes/sacar', sacar);
rotas.post('/transacoes/transferir', transferir);
rotas.get('/contas/saldo', verificaSenhaUsuario, consultarSaldo);
rotas.get('/contas/extrato', verificaSenhaUsuario, emitirExtrato);

module.exports = rotas;
