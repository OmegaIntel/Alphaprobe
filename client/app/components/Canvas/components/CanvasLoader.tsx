import {  FC } from 'react';


type LoaderProps = {
    instruction : string
}

const CanvasLoader: FC<LoaderProps> = (props) => {
  return (
    <div
      className={
        'z-10  w-full bg-indigo-200 items-center border-1 border-black rounded-md p-2 h-8'
      }
    >
      <div className="min-w-1 float-start">
        <div className="w-4 h-4 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div className="truncate ml-6">
        <p className="text-black text-xs">
          {props.instruction}
        </p>
      </div>
    </div>
  );
};

export default CanvasLoader;
