import React, { useEffect, useState } from 'react'
import DilligenceContainer from '../../dilligence_list/container';
import Subcategories from '../subcategories';

const Categories = () => {
    const categoryList = ["Investment Thesis", "Market research", "Financial Insights", "Valuation", "Action Items"];
    const [isActive, setActive] = useState("Investment Thesis");

    return (
        <>
            <div className='flex flex-row bg-[#151518] pt-5 px-5 ml-1'>
                {categoryList.map((data, index) => {
                    return (
                        data === isActive ? <div className='bg-[#212126] p-3 rounded-lg cursor-pointer' key={index}>
                            {data}
                        </div> :
                            <div key={index} className=' cursor-pointer p-3' onClick={() => setActive(data)}>
                                {data}
                            </div>
                    )
                })}
            </div>
            {isActive === "Action Items" ? <DilligenceContainer /> : <Subcategories isActiveCategory={isActive} />}
        </>
    )
}

export default Categories;