import KanbanBoard from ".";

const DilligenceContainer = () => {
    return (
        <>
                <div className="bg-[#151518] flex flex-col w-full flex-grow overflow-auto border-l-4 border-[#1e1e1e]">
                <div className="text-4xl font-bold m-10">
                    Project Alpha
                </div>
                <KanbanBoard />
            </div>
        </>
    )
}

export default DilligenceContainer;
