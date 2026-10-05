/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppModalRouter, AppModalRouterProps } from './modals/AppModalRouter';

export type ModalRouterProps = AppModalRouterProps;

export const ModalRouter: React.FC<ModalRouterProps> = (props) => {
  return <AppModalRouter {...props} />;
};

export default ModalRouter;
