import React, { Fragment, useState } from 'react';

import NotificationAdapterMutator from './components/notificationAdapter/NotificationAdapterMutator';
import NotificationAdapterTable from '../../../components/table/NotificationAdapterTable';
import { Icon, Form, Button, Label } from 'semantic-ui-react';
import ProviderTable from '../../../components/table/ProviderTable';
import ProviderMutator from './components/provider/ProviderMutator';
import ToastContext from '../../../components/toasts/ToastContext';
import Headline from '../../../components/headline/Headline';
import { useDispatch, useSelector } from 'react-redux';
import { xhrPost } from '../../../services/xhr';
import { useHistory } from 'react-router-dom';
import { useParams } from 'react-router';

import './JobMutation.less';
import Switch from 'react-switch';
import { SegmentPart } from '../../../components/segment/SegmentPart';

export default function JobMutator() {
  const jobs = useSelector((state) => state.jobs.jobs);
  const params = useParams();

  const jobToBeEdit = params.jobId == null ? null : jobs.find((job) => job.id === params.jobId);

  const defaultBlacklist = jobToBeEdit?.blacklist || [];
  const defaultName = jobToBeEdit?.name || null;
  const defaultProviderData = jobToBeEdit?.provider || [];
  const defaultNotificationAdapter = jobToBeEdit?.notificationAdapter || [];
  const defaultEnabled = jobToBeEdit?.enabled ?? true;

  const [providerCreationVisible, setProviderCreationVisibility] = useState(false);
  const [notificationCreationVisible, setNotificationCreationVisibility] = useState(false);
  const [editNotificationAdapter, setEditNotificationAdapter] = useState(null);
  const [providerData, setProviderData] = useState(defaultProviderData);
  const [name, setName] = useState(defaultName);
  const [blacklist, setBlacklist] = useState(defaultBlacklist);
  const [notificationAdapterData, setNotificationAdapterData] = useState(defaultNotificationAdapter);
  const [enabled, setEnabled] = useState(defaultEnabled);
  const history = useHistory();
  const dispatch = useDispatch();
  const ctx = React.useContext(ToastContext);

  const isSavingEnabled = () => {
    return notificationAdapterData.length > 0 && providerData.length > 0 && name != null && name.length > 0;
  };

  const mutateJob = async () => {
    try {
      await xhrPost('/api/jobs', {
        provider: providerData,
        notificationAdapter: notificationAdapterData,
        name,
        blacklist,
        enabled,
        jobId: jobToBeEdit?.id || null,
      });
      await dispatch.jobs.getJobs();
      ctx.showToast({
        title: 'Success',
        message: 'Job successfully saved...',
        delay: 5000,
        backgroundColor: '#87eb8f',
        color: '#000',
      });
      history.push('/jobs');
    } catch (Exception) {
      console.error(Exception.json.message);

      ctx.showToast({
        title: 'Error',
        message: Exception.json != null ? Exception.json.message : Exception,
        delay: 8000,
        backgroundColor: '#db2828',
        color: '#fff',
      });
    }
  };

  return (
    <Fragment>
      <ProviderMutator
        visible={providerCreationVisible}
        onVisibilityChanged={(visible) => setProviderCreationVisibility(visible)}
        onData={(data) => {
          setProviderData([...providerData, data]);
        }}
      />

      {notificationCreationVisible && (
        <NotificationAdapterMutator
          visible={notificationCreationVisible}
          onVisibilityChanged={(visible) => {
            setEditNotificationAdapter(null);
            setNotificationCreationVisibility(visible);
          }}
          selected={notificationAdapterData}
          editNotificationAdapter={
            editNotificationAdapter == null
              ? null
              : notificationAdapterData.find((adapter) => adapter.id === editNotificationAdapter)
          }
          onData={(data) => {
            const oldData = [...notificationAdapterData].filter((o) => o.id !== data.id);
            setNotificationAdapterData([...oldData, data]);
          }}
        />
      )}

      <Headline text={jobToBeEdit ? 'Edit a Job' : 'Create a new Job'} />
      <Form>
        <SegmentPart name="Name">
          <Form.Input
            type="text"
            maxLength={40}
            placeholder="Name"
            autoFocus
            inverted
            width={6}
            defaultValue={name}
            onChange={(e) => setName(e.target.value)}
          />
        </SegmentPart>

        <SegmentPart
          name="Provider"
          icon="briefcase"
          helpText={
            'A provider is essentially the service (Immowelt etc.) that Fredy is using to search for new listings. When adding a new provider, Fredy will open a new tab pointing ' +
            'to the website of this provider. You have to adjust your search parameter and click on "Search". If the results are being shown, copy the browser url. This is the url, Fredy will use ' +
            'to search for new listings.'
          }
        >
          <Form.Button primary className="jobMutation__newButton" onClick={() => setProviderCreationVisibility(true)}>
            <Icon name="plus" />
            Add new Provider
          </Form.Button>

          <ProviderTable
            providerData={providerData}
            onRemove={(providerId) => {
              setProviderData(providerData.filter((provider) => provider.id !== providerId));
            }}
          />
        </SegmentPart>

        <SegmentPart
          icon="bell"
          name="Notification Adapter"
          helpText="Fredy supports multiple ways to notify you about new findings. These are called notification adapter. You can chose between email, Telegram etc."
        >
          <Form.Button
            primary
            className="jobMutation__newButton"
            onClick={() => setNotificationCreationVisibility(true)}
          >
            <Icon name="plus" />
            Add new Notification Adapter
          </Form.Button>

          <NotificationAdapterTable
            notificationAdapter={notificationAdapterData}
            onRemove={(adapterId) => {
              setEditNotificationAdapter(null);
              setNotificationAdapterData(notificationAdapterData.filter((adapter) => adapter.id !== adapterId));
            }}
            onEdit={(adapterId) => {
              setEditNotificationAdapter(adapterId);
              setNotificationCreationVisibility(true);
            }}
          />
        </SegmentPart>

        <SegmentPart
          icon="bell"
          name="Blacklist"
          helpText="If a listing contains one of these words, it will be filtered out. Words must be comma separated. To remove a word from the black list, just click the red label(s)."
        >
          <Form.Input
            type="text"
            maxLength={40}
            placeholder="Comma separated list of blacklisted words"
            autoFocus
            inverted
            width={6}
            onChange={(e) => {
              if (e.target.value.indexOf(',') !== -1) {
                setBlacklist([...blacklist, e.target.value.replace(',', '')]);
                e.target.value = '';
              }
            }}
          />
          {blacklist.map((blacklistWord) => (
            <Label
              as="a"
              key={`blacklist_${blacklistWord}`}
              onClick={(e, obj) => {
                setBlacklist(blacklist.filter((word) => word !== obj.content));
              }}
              content={blacklistWord}
              icon="thumbs down"
              color="red"
            />
          ))}
        </SegmentPart>

        <SegmentPart
          icon="play circle outline"
          name="Job activation"
          helpText="Whether or not the job is activated. If it is not activated, it will be ignored when Fredy checks for new listings."
        >
          <Switch className="jobMutation__spaceTop" onChange={(checked) => setEnabled(checked)} checked={enabled} />
        </SegmentPart>

        <Button color="red" onClick={() => history.push('/jobs')}>
          Cancel
        </Button>
        <Button color="green" disabled={!isSavingEnabled()} onClick={mutateJob}>
          Save
        </Button>
      </Form>
    </Fragment>
  );
}
