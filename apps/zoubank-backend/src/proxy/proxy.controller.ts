import {Controller, Get, Param} from '@nestjs/common';
import {ProxyService} from "./proxy.service";

@Controller('proxy')
export class ProxyController {


    constructor(private readonly proxyService: ProxyService) {
    }

    @Get("/resonite/users/:userId")
    async getUserInfoById(@Param("userId") userId: string) {
        return this.proxyService.getUserInfoById(userId)
    }

}
