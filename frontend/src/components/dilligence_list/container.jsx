import KanbanBoard from ".";
import { ReactComponent as TimeIcon } from "../../icons/svgviewer-output_11.svg";
import { ReactComponent as ChatPlusIcon } from "../../icons/svgviewer-output_12.svg";
import { ReactComponent as DotsIcon } from "../../icons/svgviewer-output_13.svg";
import { ReactComponent as CrossIcon } from "../../icons/svgviewer-output_14.svg";

const DilligenceContainer = () => {
    return (
        <>
            <div className="bg-[#151518] flex flex-col w-full flex-grow overflow-auto ml-1">
                {/* <div className="flex justify-end items-start p-4">
                    <TimeIcon className="mx-2 cursor-pointer" />
                    <ChatPlusIcon className="mx-2 cursor-pointer" />
                    <DotsIcon className="mx-2 cursor-pointer" />
                    <CrossIcon className="mx-2 cursor-pointer" />
                </div> */}
                <div className="text-4xl font-bold m-10">
                    Project Alpha
                </div>
                <KanbanBoard />
            </div>
        </>
    )
}

export default DilligenceContainer;
