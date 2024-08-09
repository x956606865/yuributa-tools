export async function addNewBookList(name: string | undefined, link: string | undefined) {
  const result = await fetch('/api/crawlee/booksList', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      link,
    }),
  });
  const jsonData = await result.json();
  if (result.status === 200) {
    return {
      success: true,
      error: null,
    };
  }
  return {
    success: false,
    error: jsonData.error,
  };
}

export async function getBookList(page: number = 1, pageSize: number = 10) {
  const url = new URL('/api/crawlee/booksList', window.location.origin);
  url.searchParams.append('page', page + '');
  url.searchParams.append('pageSize', pageSize + '');
  const result = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const jsonData = await result.json();
  if (result.status === 200) {
    return {
      success: true,
      error: null,
      data: jsonData.data,
      total: jsonData.total,
      has_more: jsonData.has_more,
    };
  }
  return {
    success: false,
    error: jsonData.error,
  };
}

export async function deleteBookList(id: string) {
  const result = await fetch(`/api/crawlee/booksList/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const jsonData = await result.json();
  if (result.status === 200) {
    return {
      success: true,
      error: null,
    };
  }
  return {
    success: false,
    error: jsonData.error,
  };
}
export async function deleteDatasets(id: string) {
  const result = await fetch(`/api/crawlee/booksList/${id}/datasets`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const jsonData = await result.json();
  if (result.status === 200) {
    return {
      success: true,
      error: null,
    };
  }
  return {
    success: false,
    error: jsonData.error,
  };
}
export async function getDatasets(id: string) {
  const result = await fetch(`/api/crawlee/booksList/${id}/datasets`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const jsonData = await result.json();
  if (result.status === 200) {
    return {
      success: true,
      error: null,
      data: jsonData.data,
    };
  }
  return {
    success: false,
    error: jsonData.error,
  };
}
export async function getServerStatus() {
  const result = await fetch(`/api/crawlee/status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const jsonData = await result.json();
  if (result.status === 200) {
    return {
      success: true,
      error: null,
      data: jsonData.data,
    };
  }
  return {
    success: false,
    error: jsonData.error,
  };
}
export async function importDatasets(id: string, preset: any, token: any, databaseId: any) {
  const result = await fetch(`/api/crawlee/booksList/${id}/datasets/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      preset,
      token,
      databaseId,
    }),
  });
  const jsonData = await result.json();
  if (result.status === 200) {
    return {
      success: true,
      error: null,
      data: jsonData.data,
    };
  }
  return {
    success: false,
    error: jsonData.error,
  };
}
export async function fetchBookList(id: string) {
  const result = await fetch(`/api/crawlee/tasks/fetch/douban/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const jsonData = await result.json();
  if (result.status === 200) {
    return {
      success: true,
      error: null,
    };
  }
  return {
    success: false,
    error: jsonData.error,
  };
}
