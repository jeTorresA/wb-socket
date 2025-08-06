import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';

@Module({
    controllers: [FilesController],
    providers: [],
    imports: []
})
export class FilesModule {}
