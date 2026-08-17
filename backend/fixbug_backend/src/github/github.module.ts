import { Global, Module } from '@nestjs/common';
import { GithubService } from './github.service';
import { GithubController } from './github.controller';

@Global()
@Module({
  providers: [GithubService],
  exports:[GithubService],
  controllers: [GithubController]
})
export class GithubModule {}
