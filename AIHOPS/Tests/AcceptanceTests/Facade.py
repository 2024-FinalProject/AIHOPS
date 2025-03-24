class Facade:

    def register_and_verify(self, server, cookie, email, passwd):
        res = server.register(cookie, email, passwd)
        if not res.success:
            return res
        return server.verify(cookie, email, passwd, "1234")

