import { Module } from '@nestjs/common';
import { CodingWarWsService } from './coding-war-ws.service';
import { CodingWarGateway } from './coding-war.gateway';

@Module({
  providers: [CodingWarGateway, CodingWarWsService],
  exports: [CodingWarWsModule],
})
export class CodingWarWsModule {}
