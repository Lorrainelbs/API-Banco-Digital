const bancodedados = require('./bancodedados');

// Middleware de verificação da senha do banco
const verificaSenhaBanco = (req, res, next) => {
    const senhaBanco = req.query.senha_banco;

    if (senhaBanco === 'Cubos123Bank') {
        // Senha correta, permitir a continuação da requisição
        next();
    } else {
        // Senha incorreta, enviar uma resposta de erro
        return res.status(401).json({ mensagem: 'A senha é inválida!' });
    }
};


// Middleware de verificação da senha do usuario
const verificaSenhaUsuario = (req, res, next) => {
    const { numero_conta, senha } = req.query;

    const conta = bancodedados.contas.find(conta => conta.numero === numero_conta);

    if (!conta) {
        return res.status(404).json({ mensagem: 'Conta bancária não encontrada!' });
    }

    if (senha !== conta.usuario.senha) {
        return res.status(401).json({ mensagem: 'Senha incorreta!' });
    }

    next();
};

module.exports = {
    verificaSenhaBanco,
    verificaSenhaUsuario
};
