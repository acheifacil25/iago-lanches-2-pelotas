"""Exceções de Domínio e Regras de Negócio."""


class DominioException(Exception):
    """Exceção base de domínio."""
    pass


class BipDuplicadoException(DominioException):
    """Lançada quando dois motoboys tentam bipar o mesmo pedido simultaneamente."""
    pass


class PedidoNaoEncontradoException(DominioException):
    """Lançada quando um código de barras não corresponde a nenhum pedido ativo."""
    pass


class MotoboyIndisponivelException(DominioException):
    """Lançada quando um motoboy offline tenta realizar despacho."""
    pass


class AssinaturaInvalidaException(DominioException):
    """Lançada quando a requisição do cardápio digital falha na validação HMAC."""
    pass
