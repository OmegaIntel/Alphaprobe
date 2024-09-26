import KanbanBoard from ".";

const DilligenceContainer = () => {
    return (
        <>
            <div className="bg-[#151518] flex flex-col w-full flex-grow overflow-auto ml-1">
                <div className="text-4xl font-bold m-10">
                    Project Alpha
                </div>
                <KanbanBoard />
            </div>
        </>
    )
}

export default DilligenceContainer;
