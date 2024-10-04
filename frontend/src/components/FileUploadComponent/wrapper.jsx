import React, { useEffect, useState } from 'react'
import FileUploadComponent from '.';
import { useParams } from 'react-router-dom';
import UploadFilesModal from '../UploadFilesModal';
import { getDealId } from '../../services/magicLink';
import { notification } from 'antd';

const DocumentsWrapper = () => {
    const { id } = useParams();
    const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
    const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
    const [dealId, setDealId] = useState();
    useEffect(() => {
        if (id) {
            const payload = {
                token: id
            }
            getDealId(payload).then((data) => setDealId(data.deal_id)).catch((e) => { console.log(e); notification.error({ "message": "Something went wrong!" }) })
        }
    }, [id])
    return (
        <div>
            <UploadFilesModal isUploadModalVisible={isUploadModalVisible}
                setIsUploadModalVisible={setIsUploadModalVisible}
                isUpdateModalVisible={isUpdateModalVisible}
                setIsUpdateModalVisible={setIsUpdateModalVisible}
                dealId={dealId}
                isPublic={true}
            />
            <FileUploadComponent 
                dealId={dealId} 
                isUploadModalVisible={isUploadModalVisible} 
                setIsUploadModalVisible={setIsUploadModalVisible} 
                isUpdateModalVisible={isUpdateModalVisible}
                isPublic={true}
            />
        </div>
    )
}

export default DocumentsWrapper;