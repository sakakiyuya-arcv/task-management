module.exports = (objectPagination,query,countRecords) => {
    if(query.page){
        objectPagination.currentPage = parseInt(query.page);
    }
    objectPagination.skip = (objectPagination.currentPage - 1) * objectPagination.limititems;
    const totalPages = Math.ceil(countRecords / objectPagination.limititems);
    objectPagination.totalPages = totalPages;
    return objectPagination;
}
