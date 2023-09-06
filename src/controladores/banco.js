const bancodedados = require('../bancodedados');

const listarContas = (req, res) => {
    const { senha_banco } = req.query;

    if (senha_banco !== bancodedados.banco.senha) {
        return res.status(401).json({ mensagem: 'A senha é inválida!' });
    }

    return res.status(200).json(bancodedados.contas);
};


const criarConta = (req, res) => {

    const { nome, cpf, data_nascimento, telefone, email, senha } = req.body;

    const contaExistente = bancodedados.contas.find(conta =>
        conta.usuario.cpf === cpf || conta.usuario.email === email
    );

    if (contaExistente) {
        return res.status(403).json({ mensagem: 'Já existe uma conta com o CPF ou e-mail informado!' });
    }

    if (!nome || !cpf || !data_nascimento || !telefone || !email || !senha) {
        return res.status(400).json({ mensagem: 'Todos os campos são obrigatório' });
    }

    const novaConta =
    {
        numero: bancodedados.numeroNovaConta,
        saldo: 0,
        usuario: {
            nome,
            cpf,
            data_nascimento,
            telefone,
            email,
            senha
        }
    }
    bancodedados.numeroNovaConta++
    bancodedados.contas.push(novaConta);

    return res.status(201).json(novaConta);
};


const atualizarUsuario = (req, res) => {
    const numeroConta = req.params.numeroConta;
    const dadosAtualizados = req.body;

    const conta = bancodedados.contas.find(conta => conta.numero === numeroConta);

    if (!conta) {
        return res.status(404).json({ mensagem: 'Conta bancária não encontrada!' });
    }

    const outroUsuario = bancodedados.contas.find(
        conta =>
            (conta.usuario.cpf === dadosAtualizados.cpf ||
                conta.usuario.email === dadosAtualizados.email) &&
            conta.numero !== numeroConta
    );

    if (outroUsuario) {
        return res.status(400).json({
            mensagem: 'O CPF informado já existe cadastrado!'
        });
    }

    conta.usuario = { ...conta.usuario, ...dadosAtualizados };

    return res.status(204).end();
};

const excluirConta = (req, res) => {
    const numeroConta = req.params.numeroConta;

    const contaIndex = bancodedados.contas.findIndex(
        conta => conta.numero === numeroConta
    );

    if (contaIndex === -1) {
        return res.status(404).json({ mensagem: 'Conta bancária não encontrada!' });
    }

    const conta = bancodedados.contas[contaIndex];

    if (conta.saldo !== 0) {
        return res.status(400).json({ mensagem: 'A conta só pode ser removida se o saldo for zero!' });
    }

    bancodedados.contas.splice(contaIndex, 1);

    return res.status(204).end();
};

const depositar = (req, res) => {
    const { numero_conta, valor } = req.body;

    const conta = bancodedados.contas.find(conta => conta.numero === numero_conta);

    if (!conta) {
        return res.status(404).json({ mensagem: 'Conta bancária não encontrada!' });
    }

    if (valor <= 0) {
        return res.status(400).json({ mensagem: 'O valor do depósito deve ser maior que zero!' });
    }

    conta.saldo += valor;

    bancodedados.depositos.push({
        numero_conta,
        valor
    });

    return res.status(204).end();
};

const sacar = (req, res) => {
    const { numero_conta, valor, senha } = req.body;

    const conta = bancodedados.contas.find(conta => conta.numero === numero_conta);

    if (!conta) {
        return res.status(404).json({ mensagem: 'Conta bancária não encontrada!' });
    }

    if (valor <= 0) {
        return res.status(400).json({ mensagem: 'O valor do saque deve ser maior que zero!' });
    }

    if (senha !== conta.usuario.senha) {
        return res.status(401).json({ mensagem: 'Senha incorreta!' });
    }

    if (conta.saldo < valor) {
        return res.status(400).json({ mensagem: 'Saldo insuficiente!' });
    }

    conta.saldo -= valor;

    bancodedados.saques.push({
        numero_conta,
        valor,
        senha
    });

    return res.status(204).end();
};

const transferir = (req, res) => {
    const { numero_conta_origem, numero_conta_destino, valor, senha } = req.body;

    const contaOrigem = bancodedados.contas.find(conta => conta.numero === numero_conta_origem);
    const contaDestino = bancodedados.contas.find(conta => conta.numero === numero_conta_destino);

    if (!contaOrigem || !contaDestino) {
        return res.status(404).json({ mensagem: 'Conta bancária não encontrada!' });
    }

    if (valor <= 0) {
        return res.status(400).json({ mensagem: 'O valor da transferência deve ser maior que zero!' });
    }

    if (senha !== contaOrigem.usuario.senha) {
        return res.status(401).json({ mensagem: 'Senha incorreta!' });
    }

    if (contaOrigem.saldo < valor) {
        return res.status(400).json({ mensagem: 'Saldo insuficiente!' });
    }

    contaOrigem.saldo -= valor;
    contaDestino.saldo += valor;

    bancodedados.transferencias.push({
        numero_conta_origem,
        numero_conta_destino,
        valor,
        data: new Date().toISOString()
    });

    return res.status(204).end();
};

const consultarSaldo = (req, res) => {
    const { numero_conta, senha } = req.query;

    const conta = bancodedados.contas.find(conta => conta.numero === numero_conta);

    if (!conta) {
        return res.status(404).json({ mensagem: 'Conta bancária não encontrada!' });
    }

    if (senha !== conta.usuario.senha) {
        return res.status(401).json({ mensagem: 'Senha incorreta!' });
    }

    return res.status(200).json({ saldo: conta.saldo });
};

const emitirExtrato = (req, res) => {
    const { numero_conta, senha } = req.query;

    const conta = bancodedados.contas.find(conta => conta.numero === numero_conta);

    if (!conta) {
        return res.status(404).json({ mensagem: 'Conta bancária não encontrada!' });
    }

    if (senha !== conta.usuario.senha) {
        return res.status(401).json({ mensagem: 'Senha incorreta!' });
    }

    const depositos = bancodedados.depositos.filter(dep => dep.numero_conta === numero_conta);
    const saques = bancodedados.saques.filter(sa => sa.numero_conta === numero_conta);
    const transferenciasEnviadas = bancodedados.transferencias.filter(trans => trans.numero_conta_origem === numero_conta);
    const transferenciasRecebidas = bancodedados.transferencias.filter(trans => trans.numero_conta_destino === numero_conta);

    const extrato = {
        depositos,
        saques,
        transferenciasEnviadas,
        transferenciasRecebidas
    };

    return res.status(200).json(extrato);
};

module.exports = {
    listarContas,
    criarConta,
    atualizarUsuario,
    excluirConta,
    depositar,
    sacar,
    transferir,
    consultarSaldo,
    emitirExtrato
};

