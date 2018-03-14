import { ReflectMetadata } from '@nestjs/common';

export const MethodName = (name: string) => ReflectMetadata('method_name', name);