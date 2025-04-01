import * as React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { k8sPatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import {
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
  createModalLauncher,
} from '@console/internal/components/factory/modal';
import { HandlePromiseProps, withHandlePromise } from '@console/internal/components/utils';
import { OAuthModel } from '@console/internal/models';
import { YellowExclamationTriangleIcon } from '@console/shared';
import { OAuthKind } from '@console/internal/module/k8s';

export const RemoveIDPModal = withHandlePromise(
  ({
    obj,
    idpName,
    type,
    inProgress,
    errorMessage,
    cancel,
    close,
    handlePromise,
  }: RemoveUserModalProps) => {
    const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
      const indexToRemove = obj.spec.identityProviders?.findIndex((idp) => idp.name === idpName);
      e.preventDefault();

      return handlePromise(
        k8sPatchResource({
          model: OAuthModel,
          resource: obj,
          data: [
            {
              op: 'remove',
              path: `/spec/identityProviders/${indexToRemove}`,
            },
          ],
        }),
        close,
      );
    };

    const { t } = useTranslation();
    return (
      <form onSubmit={submit} name="form" className="modal-content ">
        <ModalTitle>
          <YellowExclamationTriangleIcon className="co-icon-space-r" />
          {t('public~Remove Identity provider from QAuth?')}
        </ModalTitle>
        <ModalBody>
          <ModalBody>
            <Trans t={t} ns="public" i18nKey="Remove Identity provider from QAuth?">
              Are you sure you want to remove Identity provider{' '}
              <strong className="co-break-word">{{ idpName }}</strong> from QAuth{' '}
              <strong className="co-break-word">{{ type }}</strong>?
            </Trans>
          </ModalBody>
          {/* <Trans t={t} ns="public">
            Are you sure you want to remove Identity provider{' '}
            <strong className="co-break-word">{idpName}</strong> from QAuth{' '}
            <strong className="co-break-word">{type}</strong>?
          </Trans> */}
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={errorMessage}
          inProgress={inProgress}
          submitText={t('public~Remove')}
          cancel={cancel}
          submitDanger
        />
      </form>
    );
  },
);

export const removeIDPModal = createModalLauncher(RemoveIDPModal);

export type RemoveUserModalProps = {
  obj: OAuthKind;
  idpName: string;
  type: string;
} & ModalComponentProps &
  HandlePromiseProps;
