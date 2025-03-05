import { FC, useState } from 'react';
import { Form } from '@remix-run/react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from '../ui/select';
import { useLocation } from '@remix-run/react';
import { templates } from './utils';
import { useNavigate } from '@remix-run/react';
import { useDispatch } from 'react-redux';
import { setIsCanvas } from '~/store/slices/sideBar';
import FileUpload from '../UploadFile/UploadFile';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { useForm } from 'react-hook-form';
import * as Popover from '@radix-ui/react-popover';

type FormType = {
  documentFiles: File[];
  sources: string[];
  instructions: string;
  templateId: string;
};

const DocumentCreation: FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const templateId = location.search.split('=')[1];
  const template = templates.find((temp) => temp.id === templateId);
  const [isUploadFileOpen, setIsUploadFileOpen] = useState<boolean>(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([
    'web',
    'marketData',
    'file',
  ]);

  console.log('location-------------', location.search);

  const formMethods = useForm<FormType>({
    defaultValues: {
      documentFiles: [],
      sources: ['web', 'marketData', 'file'],
      instructions: '',
      templateId: templateId,
    },
  });

  const values = formMethods.watch();

  const toggleOption = (option: string) => {
    setSelectedOptions((prev) => {
      const newOpt = prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option];
      formMethods.setValue('sources', newOpt);
      return newOpt;
    });
  };
  return (
    <div className="p-4 mx-auto">
      <div className="max-w-lg">
        {/* Title */}
        <h1 className="text-2xl">{`Generate ${template?.title} Document`}</h1>
        <p className="text-gray-400 mt-1 text-sm">{template?.description}</p>

        {/* Tags */}
        <div className="mt-4 flex gap-2">
          {template?.tags.map((tag) => (
            <span
              key={tag}
              className="bg-gray-100 text-gray-800 px-3 py-1 text-xs rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Reference Documents */}
        {/* <Form method="POST" action={`/newdocument?template=${templateId}`}> */}
          <div className="mt-6">
            <label className="block text-sm font-semibold">
              Reference Documents (Optional)
            </label>
            <div className="mt-2 border border-gray-300 rounded-md p-3 flex justify-between items-center">
              <span className="text-gray-500 text-sm">Upload Documents</span>
              <Button
                onClick={() => {
                  setIsUploadFileOpen(true);
                }}
                className="p-2 bg-indigo-500 text-white rounded"
              >
                +
              </Button>
            </div>
          </div>

          {/* Sources Dropdown */}
          <div className="mt-6">
            <label className="block text-sm font-semibold">Sources</label>
            {/* <Select>
              <SelectTrigger className="w-full mt-2 border border-gray-300 rounded-md p-3 text-left">
                <SelectValue placeholder="Choose a template"  />
              </SelectTrigger>
              <SelectContent className="bg-white shadow-lg border rounded-md">
                {[ 
                  { value: 'web', label: 'The Web' },
                  { value: 'marketData', label: 'Public Markets Data' },
                  { value: 'file', label: 'Your Files' },
                ].map((template) => (
                  <SelectItem key={template.value} value={template.value}>
                    {template.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select> */}
            <Popover.Root>
              <Popover.Trigger asChild>
                <button className="w-full mt-2 border border-gray-300 rounded-md p-3 text-left">
                  {selectedOptions.length > 0
                    ? `${selectedOptions[0]} ${selectedOptions.length > 1 ? `+${selectedOptions.length - 1}` : ''}`
                    : 'Select Sources'}
                </button>
              </Popover.Trigger>

              <Popover.Content className="bg-white shadow-lg border rounded-md p-3 w-[513px]">
                {[
                  { value: 'web', label: 'The Web' },
                  { value: 'marketData', label: 'Public Markets Data' },
                  { value: 'file', label: 'Your Files' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 py-1 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedOptions.includes(option.value)}
                      onChange={() => toggleOption(option.value)}
                      className="w-4 h-4 !text-indigo-600 !bg-indigo-600"
                    />
                    {option.label}
                  </label>
                ))}
              </Popover.Content>
            </Popover.Root>
          </div>

          {/* Instructions Input */}
          <div className="mt-6">
            <label className="block text-sm font-semibold">Instructions</label>
            <Textarea
              onChange={(e) => {
                formMethods.setValue('instructions', e.target.value);
              }}
              value={values.instructions}
              className="w-full mt-2 border border-gray-300 rounded-md p-3"
              placeholder="Enter a prompt, ask a question or search the web"
            />
          </div>
        {/* </Form> */}

        {/* Create Document Button */}
        <div className="mt-6">
          <Button
            onClick={() => {
              navigate('../document/3452', {
                state: { instructions: values.instructions },
              });
              dispatch(setIsCanvas(true));
            }}
            className="bg-indigo-600 py-3 rounded-md hover:bg-indigo-700"
          >
            Create Document
          </Button>
        </div>

        <Dialog
          open={isUploadFileOpen}
          onOpenChange={() => {
            setIsUploadFileOpen(!isUploadFileOpen);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <FileUpload
              onFilesUploaded={(file: File[]) => {
                console.log('file-------', file);
                const val = formMethods.getValues();
                formMethods.setValue('documentFiles', [
                  ...val.documentFiles,
                  ...file,
                ]);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DocumentCreation;
