import { Controller, Get, Param, Query } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { QueryContractDto } from './dto/query-contract.dto';

@ApiTags('Contracts')
@ApiBearerAuth()
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách hợp đồng' })
  findAll(@Query() query: QueryContractDto) {
    return this.contractsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết hợp đồng' })
  @ApiParam({ name: 'id', description: 'ID của hợp đồng' })
  findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id);
  }
}
