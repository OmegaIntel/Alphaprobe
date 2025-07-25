import { FC, useState } from 'react';
import InputComponent from '../InputBar/InputComponent';
import { useForm, Controller } from 'react-hook-form';
import * as RadioGroup from '@radix-ui/react-radio-group';
import * as Switch from '@radix-ui/react-switch';
import {
  Globe,
  FileSearch,
  GalleryVerticalEnd,
  Timer,
  CircleCheck,
  CheckCircle,
} from 'lucide-react';
import clsx from 'clsx';
import { ResearchType, templates } from '../reportUtils';
import FileUpload from './FileUpload';
import { v4 as uuidv4 } from 'uuid';
import {
  InitialFormData,
  ReportType,
  researchTypeOptions,
} from '../reportUtils';
import { getUniqueID } from '~/lib/utils';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '~/store/store';

type UploadedDOC = {
  file_name: string;
  file_path: string;
};

type THeroProps = {
  promptValue: string;
  setPromptValue: React.Dispatch<React.SetStateAction<string>>;
  handleDisplayResult: (query: InitialFormData) => void;
};

const InitialPage: FC<THeroProps> = ({
  promptValue,
  setPromptValue,
  handleDisplayResult,
}) => {
  const { activeProjectId } = useSelector((state: RootState) => state.sidebar);
  const tempProjectID = activeProjectId?.temp_project_id || getUniqueID();
  const { control, handleSubmit, watch, setValue } = useForm<InitialFormData>({
    defaultValues: {
      reportType: 'market-sizing',
      preferences: { web: true, file: false },
      uploadedDocuments: [],
      promptValue: '',
      temp_project_id: tempProjectID,
      researchType: 'research',
    },
  });

  const generateReport: { project_id: string } = {
    project_id: '',
  };

  //@ts-ignore
  globalThis.reportGeneration = generateReport;

  const formWatch = watch();

  const onSubmit = (data: InitialFormData) => {
    console.log('Report Data:', data.uploadedDocuments);
    let newData = {
      reportType: data.reportType,
      preferences: data.preferences,
      uploadedDocuments: data.uploadedDocuments,
    };

    localStorage.setItem('promtPreferance', JSON.stringify(newData));
  };

  const handleClickSuggestion = (value: string) => {
    setPromptValue(value);
  };

  const setUploadedDocuments = (files: UploadedDOC[]) => {
    setValue('uploadedDocuments', files);
  };
  //const removeFile = (fileName: string) => {
  // let files = formWatch.uploadedDocuments;
  // let newFiles = files.filter((file) => file.name !== fileName);
  // setValue('uploadedDocuments', newFiles);
  //};

  return (
    <div className="flex flex-col items-center py-8 md:py-12 lg:pt-8 lg:pb-16 overflow-x-auto">
      <div className="w-full">
        <h1 className="text-xl font-semibold mb-2">AI Report Generation</h1>
        <p className="text-sm text-gray-500">
          Say Hello to omega intelligence, your AI mate for rapid insights and
          comprehensive research
        </p>
      </div>

      {/* Report Type Selection */}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
        <div className="p-4 border-none rounded-lg bg-gray-50 space-y-4">
          <div className="w-full flex">
            <div>
              <GalleryVerticalEnd className="w-5 h-5 pr-1 pt-1" />
            </div>
            <div>
              <h1 className="text-md font-semibold">{'Report Type'}</h1>
              <p className="text-sm text-gray-500">
                Choose the right template below for your report type
              </p>
            </div>
          </div>

          <Controller
            name="reportType"
            control={control}
            render={({ field }) => (
              <RadioGroup.Root
                className="grid grid-cols-2 gap-4"
                {...field}
                onValueChange={(value) => field.onChange(value as ReportType)}
              >
                {templates.map((option) => (
                  <label
                    key={option.id}
                    className={clsx(
                      'cursor-pointer border p-3 rounded-lg flex flex-col space-y-1',
                      formWatch.reportType === option.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300 bg-white'
                    )}
                  >
                    <RadioGroup.Item className="hidden" value={option.id} />
                    <h3 className="text-sm font-semibold">{option.title}</h3>
                    <p className="text-xs text-gray-400">
                      {option.description}
                    </p>
                  </label>
                ))}
              </RadioGroup.Root>
            )}
          />

          {/* Web Search */}
          <Controller
            name="preferences.web"
            control={control}
            render={({ field }) => (
              <label className="flex items-center justify-between py-2 border rounded-lg px-4">
                <div className="flex items-center space-x-4">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">Web Search</span>
                </div>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="w-4 h-4 !text-indigo-600 !bg-indigo-600 accent-indigo-600"
                />
              </label>
            )}
          />

          {/* Advanced Reasoning */}
          <Controller
            name="preferences.file"
            // disabled={true}
            control={control}
            render={({ field }) => (
              <div className="border rounded-lg py-2 px-4">
                <label className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <FileSearch className="w-4 h-4" />
                    <span className="text-sm font-medium">Files</span>
                  </div>

                  <input
                    type="checkbox"
                    // disabled
                    checked={field.value}
                    onChange={field.onChange}
                    className="w-4 h-4 scheme-dark !bg-indigo-600 accent-indigo-600"
                  />
                </label>
                {field.value && (
                  <div className="mt-3">
                    <FileUpload
                      temp_project_id={formWatch.temp_project_id}
                      setUploadedDocuments={setUploadedDocuments}
                    />
                  </div>
                )}
              </div>
            )}
          />

          <Controller
            name="researchType"
            control={control}
            render={({ field }) => (
              <RadioGroup.Root
                className="flex gap-4"
                {...field}
                onValueChange={(value) => field.onChange(value as ResearchType)}
              >
                {researchTypeOptions.map((option) => (
                  <label
                    key={option.id}
                    className={clsx(
                      'cursor-pointer border p-[2px] w-36 rounded-full flex',
                      formWatch.researchType === option.value
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 bg-white'
                    )}
                  >
                    <RadioGroup.Item className="hidden" value={option.value} />
                    <CircleCheck
                      className={`w-8 h-8 ${
                        formWatch.researchType === option.value
                          ? 'text-green-300'
                          : 'text-gray-300'
                      }`}
                    />
                    <div className="flex flex-col ml-1">
                      <h3 className="text-xs font-semibold">{option.label}</h3>
                      <p className="flex items-center text-xs text-gray-400">
                        <Timer className="w-3 h-3 mr-1" />
                        {option.timeDurations}
                      </p>
                    </div>
                  </label>
                ))}
              </RadioGroup.Root>
            )}
          />
        </div>

        <div className="w-full pb-8 md:pb-10">
          <InputComponent
            promptValue={promptValue}
            setPromptValue={(prompt: string) => {
              setPromptValue(prompt);
              setValue('promptValue', prompt);
            }}
            handleSubmit={(prompt) => {
              setValue('promptValue', prompt);
              handleDisplayResult(formWatch);
              let newData = {
                reportType: formWatch.reportType,
                preferences: formWatch.preferences,
                uploadedDocuments: formWatch.uploadedDocuments,
                researchType: formWatch.researchType
              };
              localStorage.setItem('promtPreferance', JSON.stringify(newData));
            }}
          />
        </div>
      </form>

      {/* Input section */}
    </div>
  );
};

export default InitialPage;
